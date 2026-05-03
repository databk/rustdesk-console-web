import { getTablePaginationConfig, t } from './utils';
import { deleteAbPeersByGuid, getAbPeers, setAbPeersNote } from '@/services/rustdesk-console/addressBook';
import { AndroidFilled, AppleFilled, DeleteOutlined, KeyOutlined, PlusOutlined, QqCircleFilled, SelectOutlined, WindowsFilled } from '@ant-design/icons';
import ProTable, { ActionType, ProColumns } from '@ant-design/pro-table';
import { Button, Divider, Flex, Tooltip, message } from 'antd';
import { Fragment, useState } from 'react';
import CreateOrUpdateForm from './CreateOrUpdateForm';
import { FooterToolbar } from '@ant-design/pro-layout';
import { buildNotExistsTag, buildTag } from './TagsCard';
import DeviceSelect from './DeviceSelect';
import { useIntl } from '@umijs/max';
import RecycleBin from './RecycleBin';
import SetPasswordModal from './SetPasswordModal';
import SetTagModal from './SetTagModal';
import SetNoteModal from './SetNoteModal';
import MyModalConfirm from './MyModalConfirm';

export const DETAIL_TABLE_SORT_STATE_KEY = 'address_book_detail_table_sort_state';
export const ID_SORT_KEY = 'address_book_detail_table_id_sort_key';

export const ShareRule = {
  READ_ONLY: 0,
  READ_WRITE: 1,
  FULL_CONTROL: 2,
};

type DetailTableProps = {
  personal: boolean;
  profile: API.SharedAbProfile;
  abTags: API.AbTag[];
  deviceTableActionRef: React.MutableRefObject<ActionType | undefined>;
  selectedTags: string[];
  intersection: boolean;
};

const DetailTable: React.FC<DetailTableProps> = (props) => {
  const actionRef = props.deviceTableActionRef;
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [deviceSelectVisible, setDeviceSelectVisible] = useState<boolean>(false);
  const [recycleBinModalVisible, setRecycleBinModalVisible] = useState<boolean>(false);
  const [setPasswordModalVisible, setSetPasswordModalVisible] = useState<boolean>(false);
  const [setTagModalVisible, setSetTagModalVisible] = useState<boolean>(false);
  const [setNoteModalVisible, setSetNoteModalVisible] = useState<boolean>(false);
  const [selectedRowsState, setSelectedRows] = useState<API.AbPeer[]>([]);
  const [currentRow, setCurrentRow] = useState<API.AbPeer>();
  const [sortState, setSortState] = useState<API.SortState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DETAIL_TABLE_SORT_STATE_KEY);
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  const canEdit =
    props.personal ||
    props.profile.rule == ShareRule.READ_WRITE ||
    props.profile.rule == ShareRule.FULL_CONTROL;

  const intl = useIntl();

  const plain = (text: string, defaultMessage = '') =>
    t(`pages.AddressBook.${text}`, true, defaultMessage || text, intl) as string;

  const DeleteConfirm = (props: { children: any; onClick: () => void }) => (
    <MyModalConfirm
      title={t('deleteConfirm', true, 'Are you sure to delete?')}
      onConfirm={() => props.onClick()}
      okText="Yes"
      cancelText="No"
    >
      {props.children}
    </MyModalConfirm>
  );

  const handleDelete = async (rows: API.AbPeer[]) => {
    const hide = message.loading(t('Deleting'));
    try {
      await deleteAbPeersByGuid(props.profile.guid, {
        data: rows.map((x) => x.guid),
      });
      hide();
      message.success(t('Deletion is successful'));
      actionRef.current?.reloadAndRest?.();
      return true;
    } catch (error) {
      hide();
      message.error(
        typeof error == 'string'
          ? (error as string)
          : t('Deletion failed, please try again!'),
      );
      return false;
    }
  };

  const handleEdit = async (row: API.AbPeer) => {
    setCurrentRow(row);
    setUpdateModalVisible(true);
  };

  const buildTagWrapper = (peer: API.AbPeer) => {
    let tags = [];
    const peerTags = peer.tags ?? [];
    for (let i = 0; i < props.abTags.length; i++) {
      const contains = peerTags.find((x) => x == props.abTags[i].name);
      if (contains) {
        tags.push(
          buildTag(props.abTags[i], false, undefined, undefined, undefined),
        );
      }
    }
    for (let i = 0; i < peerTags.length; i++) {
      const contains = props.abTags.find((x) => x.name == peerTags[i]);
      if (!contains) {
        tags.push(buildNotExistsTag(peerTags[i]));
      }
    }
    return <Flex wrap="wrap" gap="small">{tags}</Flex>;
  };

  const idSortKey =
    (typeof window !== 'undefined' && localStorage.getItem(ID_SORT_KEY)) ||
    'ab_detail_id';

  const columns: ProColumns<API.AbPeer>[] = [
    {
      title: t('ID'),
      dataIndex: 'id',
      render: (dom, entity) => {
        const os = entity.platform || entity.os;
        return (
          <>
            {os && (
              <Tooltip title={os}>
                {os == 'Windows' && <WindowsFilled />}
                {os == 'Linux' && <QqCircleFilled />}
                {os == 'Android' && <AndroidFilled />}
                {os == 'Mac OS' && <AppleFilled />}
                {os == 'iOS' && <AppleFilled />}
                &nbsp;&nbsp;
              </Tooltip>
            )}
            <span>{dom}</span>
          </>
        );
      },
      key: idSortKey,
      sorter: true,
      sortOrder: sortState.columnKey === idSortKey ? sortState.order : undefined,
      hideInSearch: true,
    },
    {
      title: t('ID'),
      dataIndex: 'id',
      hideInTable: true,
    },
    {
      title: t('Device Name', true),
      dataIndex: 'device_name',
      hideInTable: true,
      hideInDescriptions: true,
    },
    {
      title: t('Device Username', true),
      dataIndex: 'device_username',
      hideInTable: true,
      hideInDescriptions: true,
    },
    {
      title: plain('Device'),
      tooltip: t('username@device_name'),
      hideInSearch: true,
      render: (dom, entity) => {
        if (entity.username && entity.hostname) {
          return entity.username + '@' + entity.hostname;
        } else {
          return entity.hostname;
        }
      },
      key: 'ab_detail_device_username',
      sorter: true,
      sortOrder:
        sortState.columnKey === 'ab_detail_device_username'
          ? sortState.order
          : undefined,
      showSorterTooltip: false,
    },
    {
      title: plain('Alias'),
      dataIndex: 'alias',
      key: 'alias',
      sorter: true,
      sortOrder: sortState.columnKey === 'alias' ? sortState.order : undefined,
      showSorterTooltip: false,
    },
    {
      title: t('Password'),
      search: false,
      hideInTable: props.personal,
      tooltip: plain('Whether a password is set'),
      render: (text, record) => record.password && <KeyOutlined />,
    },
    {
      title: plain('Tags'),
      search: false,
      render: (text, record) => buildTagWrapper(record),
    },
    {
      title: t('Note'),
      search: false,
      dataIndex: 'note',
      key: 'a_note',
      sorter: true,
      sortOrder: sortState.columnKey === 'a_note' ? sortState.order : undefined,
      showSorterTooltip: false,
    },
    {
      title: t('Action'),
      search: false,
      width: 120,
      hideInTable: !canEdit,
      render: (text, record) => (
        <Fragment>
          <a onClick={() => handleEdit(record)}>{t('Edit')}</a>
          <Divider type="vertical" />
          <DeleteConfirm onClick={() => handleDelete([record])}>
            <a>{t('Delete')}</a>
          </DeleteConfirm>
        </Fragment>
      ),
    },
  ];

  const handleSortStateChange = (sorter: any, actionRef: any, key: string, setSortState: any) => {
    const sortState =
      sorter.order && sorter.columnKey
        ? { columnKey: sorter.columnKey, order: sorter.order }
        : {};
    localStorage.setItem(key, JSON.stringify(sortState));
    setSortState(sortState);
  };

  return (
    <Fragment>
      <ProTable<
        API.AbPeer,
        API.PageParams & {
          ab: string;
          tags?: string;
          intersection?: boolean;
          hide_password?: boolean;
        }
      >
        headerTitle={plain('Devices')}
        actionRef={actionRef}
        columnsState={{
          persistenceType: 'localStorage',
          persistenceKey: 'ab_detail_columns_state',
        }}
        rowKey="id"
        params={{
          ab: props.profile.guid,
          tags:
            props.selectedTags.length > 0
              ? encodeURIComponent(JSON.stringify(props.selectedTags))
              : undefined,
          intersection:
            props.selectedTags.length > 1 && props.intersection ? true : undefined,
          hide_password: true,
        }}
        search={{ labelWidth: 120 }}
        request={getAbPeers}
        columns={columns}
        toolBarRender={() =>
          canEdit
            ? [
                <Button
                  type="primary"
                  key="primary"
                  onClick={() => {
                    setCreateModalVisible(true);
                  }}
                >
                  <PlusOutlined />
                  {t('Add')}
                </Button>,
                <Button
                  type="primary"
                  key="primary"
                  onClick={() => {
                    setDeviceSelectVisible(true);
                  }}
                >
                  <SelectOutlined />
                  {plain('Import')}
                </Button>,
                <Button
                  type="primary"
                  key="primary"
                  onClick={() => {
                    setRecycleBinModalVisible(true);
                  }}
                >
                  <DeleteOutlined />
                  {plain('Recycle Bin')}
                </Button>,
              ]
            : []
        }
        rowSelection={
          canEdit
            ? {
                onChange: (_: any, selectedRows: any) => {
                  setSelectedRows(selectedRows);
                },
              }
            : undefined
        }
        pagination={getTablePaginationConfig('address_book_details')}
        onChange={(_: any, __: any, sorter: any) =>
          handleSortStateChange(
            sorter,
            actionRef,
            DETAIL_TABLE_SORT_STATE_KEY,
            setSortState,
          )
        }
      />
      {selectedRowsState?.length > 0 && canEdit && (
        <FooterToolbar
          extra={
            <div>
              {t('Chosen')}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              {t('Items')}
            </div>
          }
        >
          <DeleteConfirm
            onClick={async () => {
              await handleDelete(selectedRowsState);
              setSelectedRows([]);
            }}
          >
            <Button>{t('Delete')}</Button>
          </DeleteConfirm>
          {!props.personal && (
            <Button onClick={() => setSetPasswordModalVisible(true)}>
              {t('set_password', true)}
            </Button>
          )}
          <Button onClick={() => setSetTagModalVisible(true)}>
            {t('set_tags', true)}
          </Button>
          <Button onClick={() => setSetNoteModalVisible(true)}>
            {t('set_note', true)}
          </Button>
        </FooterToolbar>
      )}
      <CreateOrUpdateForm
        isCreate={true}
        visible={createModalVisible}
        setModalVisible={setCreateModalVisible}
        actionRef={actionRef}
        initialValues={undefined}
        personal={props.personal}
        profile={props.profile}
        abTags={props.abTags}
      ></CreateOrUpdateForm>
      <CreateOrUpdateForm
        isCreate={false}
        visible={updateModalVisible}
        setModalVisible={setUpdateModalVisible}
        actionRef={actionRef}
        initialValues={currentRow}
        personal={props.personal}
        profile={props.profile}
        abTags={props.abTags}
      ></CreateOrUpdateForm>
      <DeviceSelect
        visible={deviceSelectVisible}
        setVisible={setDeviceSelectVisible}
        ab_guid={props.profile.guid}
        abName={props.profile.name}
        closeChangedCallback={() => {
          actionRef.current?.reload();
        }}
      ></DeviceSelect>
      <RecycleBin
        visible={recycleBinModalVisible}
        setVisible={setRecycleBinModalVisible}
        personal={props.personal}
        profile={props.profile}
        abTags={props.abTags}
        closeChangedCallback={() => {
          actionRef.current?.reload();
        }}
      ></RecycleBin>
      <SetPasswordModal
        visible={setPasswordModalVisible}
        setModalVisible={setSetPasswordModalVisible}
        actionRef={actionRef}
        profile={props.profile}
        abPeers={selectedRowsState}
      ></SetPasswordModal>
      <SetTagModal
        visible={setTagModalVisible}
        setModalVisible={setSetTagModalVisible}
        actionRef={actionRef}
        profile={props.profile}
        abPeers={selectedRowsState}
        abTags={props.abTags}
      ></SetTagModal>
      <SetNoteModal
        visible={setNoteModalVisible}
        setModalVisible={setSetNoteModalVisible}
        actionRef={actionRef}
        guids={selectedRowsState.map((x) => x.guid)}
        setFunction={(guids, note) =>
          setAbPeersNote({ guids, note, ab: props.profile.guid })
        }
      ></SetNoteModal>
    </Fragment>
  );
};

export default DetailTable;
