
import { useState, useEffect, createRef } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router";
import { AddBox, Edit, Visibility } from "@material-ui/icons";
import MuiTable from "../../components/table/table_index";
import { BASE_URL, PATH_PROJECT } from "../../utils/constants";
import { PATH_FRONTENDAPP } from "../../utils/constants";
import makeApiCall from "../../utils/makeApiCall";

function ProjectTable() {

  const tableRef = createRef();
  const snackbar = useSnackbar();
  const navigate =  useNavigate();



  const [FrontendApps, setFrontendApps] = useState({});

  useEffect(() => {
    const fetchFrontendApps = async () => {
      const typesResponse = await makeApiCall(
        `${BASE_URL}${PATH_FRONTENDAPP}`
      );
      const jsonResp = await typesResponse.json();
      const types = {};
      jsonResp.value.forEach(
        (item) =>
        (types[`${item.AppId}`] = item.Company_name)
      );
      setFrontendApps(types);
    };
    fetchFrontendApps();
  }, []);

  const columns = [
    { title: "ProjectId", field: "ProjectId", editable: "never" },
      { title: "DateOfCreation", field: "DateOfCreation" },
      { title: "Attribute3", field: "Attribute3" },
      { title: "FrontendApplication", field: "ProjectFrontendApplication", lookup: FrontendApps },
  ];
  
  const fetchData = async (query) => {
    return new Promise((resolve, reject) => {
      const { page, orderBy, orderDirection, search, pageSize } = query;
      const url = `${BASE_URL}${PATH_PROJECT}`;
      let temp = url; // Initialize with the base URL
      let filterQuery = ""; // Initialize filter query as an empty string
  
      // Handle sorting
      if (orderBy) {
        temp += `?$orderby=${orderBy.field} ${orderDirection}`;
      }
  
      // Handle searching
      if (search) {
        filterQuery = `$filter=contains($screen.getSearchField().getName(), '${search}')`;
        temp += orderBy ? `&${filterQuery}` : `?${filterQuery}`;
      }
  
      // Handle pagination
      if (page > 0) {
        const skip = page * pageSize;
        temp += orderBy || search ? `&$skip=${skip}` : `?$skip=${skip}`;
      }
  
      const countUrl = search ? `${url}/$count?${filterQuery}` : `${BASE_URL}${PATH_PROJECT}/$count`;
      let total = null;
  
      makeApiCall(countUrl)
        .then((res) => res.text())
        .then((e) => {
          total = parseInt(e, 10);
        })
        .then(() => makeApiCall(temp))
        .then((res) => res.json())
        .then(({ value }) => {
          return resolve({
            data: value,
            page: page,
            totalCount: total,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  return (
    <div className="product-container">
      {
      Object.keys(FrontendApps).length > 0 && 
      (
        <MuiTable
          tableRef={tableRef}
          title="Entity_Table"
          cols={columns}
          data={fetchData}
          size={5}
          actions={[
            {
              icon: AddBox,
              tooltip: "Add",
              onClick: () => navigate("/Projects/create"),
              isFreeAction: true,
            },
            {
              icon: Visibility,
              tooltip: "View",
              onClick: (event, rowData) =>
              navigate(`/Projects/view/${rowData.ProjectId}`),
            },
            {
              icon: Edit,
              tooltip: "Edit",
              onClick: (event, rowData) =>
              navigate(`/Projects/edit/${rowData.ProjectId}`),
            },
          ]}
          onRowDelete={async (oldData) => {
            const resp = await makeApiCall(
              `${BASE_URL}${PATH_PROJECT}(${oldData.ProjectId})`,
              "DELETE"
            );
            if (resp.ok) {
              tableRef.current.onQueryChange();
              snackbar.enqueueSnackbar("Successfully deleted Projects", {
                variant: "success",
              });
            } else {
              const jsonData = await resp.json();
              snackbar.enqueueSnackbar(`Failed! - ${jsonData.message}`, {
                variant: "error",
              });
            }
          }}
        />
      )}
    </div>
  );
}

export default ProjectTable;
